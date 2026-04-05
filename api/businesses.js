import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DATABASE || 'business_marketplace';
const COL = 'businesses';
const TRASH_COL = 'businesses_trash';

let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(DB);
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const col = db.collection(COL);
    const trashCol = db.collection(TRASH_COL);
    const { action } = req.query;

    // GET /api/businesses?action=list
    if (req.method === 'GET' && action === 'list') {
      const docs = await col.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5000).toArray();
      return res.status(200).json({ documents: docs });
    }

    // GET /api/businesses?action=trash
    if (req.method === 'GET' && action === 'trash') {
      const docs = await trashCol.find({ isDeleted: true }).sort({ deletedAt: -1 }).limit(5000).toArray();
      return res.status(200).json({ documents: docs });
    }

    // POST /api/businesses?action=add
    if (req.method === 'POST' && action === 'add') {
      const now = new Date().toISOString();
      const doc = { ...req.body, _id: generateId(), createdAt: now, updatedAt: now, isDeleted: false };
      await col.insertOne(doc);
      return res.status(200).json({ document: doc });
    }

    // POST /api/businesses?action=bulkAdd
    if (req.method === 'POST' && action === 'bulkAdd') {
      const now = new Date().toISOString();
      const docs = req.body.map(b => ({ ...b, _id: generateId(), createdAt: b.createdAt || now, updatedAt: now, isDeleted: false }));
      await col.insertMany(docs);
      return res.status(200).json({ inserted: docs.length });
    }

    // PUT /api/businesses?action=update&id=xxx
    if (req.method === 'PUT' && action === 'update') {
      const { id } = req.query;
      const updatedFields = { ...req.body, updatedAt: new Date().toISOString() };
      await col.updateOne({ _id: id }, { $set: updatedFields });
      return res.status(200).json({ ok: true });
    }

    // DELETE /api/businesses?action=delete&id=xxx  (soft delete → trash)
    if (req.method === 'DELETE' && action === 'delete') {
      const { id } = req.query;
      const now = new Date().toISOString();
      const biz = await col.findOne({ _id: id });
      if (!biz) return res.status(404).json({ error: 'Not found' });
      const deleted = { ...biz, isDeleted: true, deletedAt: now };
      await trashCol.insertOne(deleted);
      await col.deleteOne({ _id: id });
      return res.status(200).json({ ok: true });
    }

    // POST /api/businesses?action=restore&id=xxx
    if (req.method === 'POST' && action === 'restore') {
      const { id } = req.query;
      const biz = await trashCol.findOne({ _id: id });
      if (!biz) return res.status(404).json({ error: 'Not found in trash' });
      const restored = { ...biz, isDeleted: false };
      delete restored.deletedAt;
      await col.insertOne(restored);
      await trashCol.deleteOne({ _id: id });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
