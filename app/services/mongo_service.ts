import { MongoClient, Db } from 'mongodb'

class MongoService {
  private client: MongoClient | undefined
  public db: Db | undefined

  public async connect() {
    if (this.db) return this.db

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017'
    const dbName = process.env.MONGO_DB_NAME || 'inertia-systems'

    this.client = new MongoClient(uri)
    await this.client.connect()
    this.db = this.client.db(dbName)

    console.log('🍃 [MongoService] Connected to Native MongoDB')
    return this.db
  }

  // Helper untuk akses koleksi dengan cepat
  public collection(name: string) {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection(name)
  }
}

export default new MongoService()
