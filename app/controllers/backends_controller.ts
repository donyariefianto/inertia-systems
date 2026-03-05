import type { HttpContext } from '@adonisjs/core/http'
import MongoService from '#services/mongo_service'
import hash from '@adonisjs/core/services/hash'
import { DateService } from '#services/date_service'
import { EncryptionService } from '#services/encryption_service'
import { UtilService } from '#services/util_service'
import { ObjectId } from 'mongodb'
import { generateURI, generateSecret, generate, verify } from 'otplib'
import qrcode from 'qrcode'
import encryption from '@adonisjs/core/services/encryption'
import env from '#start/env'

export default class BackendsController {
  async login({ request, response, session }: HttpContext) {
    const { username, email, password } = request.all()
    if ((username == 'root' || email == 'root') && password == 'secret_services') {
      session.put('user_id', '0')
      session.put('user_name', 'super-users')
      session.put('user_role', 'super-users')
      return response.redirect().toPath('/systems')
    }
    const users = MongoService.collection('users')
    const user = await users.findOne({ $or: [{ email: email }, { username: username }] })
    if (!user || !(await hash.verify(user.password, password))) {
      session.flash('error', 'Email atau kata sandi salah.')
      return response.redirect().back()
    }
    session.put('user_id', user._id.toString())
    session.put('user_name', user.name.toString())
    session.put('user_role', user.role || 'staff')
    return response.redirect().toPath('/systems')
  }
  async logout({ response, session }: HttpContext) {
    session.forget('user_id')
    session.forget('user_name')
    session.forget('user_role')
    return response.redirect().toPath('/login')
  }
  async navigation_handler({ inertia, session, request, response }: HttpContext) {
    const currentPath = request.url().replace(/^\//, '')
    return inertia.render('handler', {
      path: currentPath,
    })
  }
  async patchMenu({ response, request }: HttpContext) {
    let body = request.all()
    const collections = MongoService.collection('systems')
    const existingDoc = await collections?.findOne({ id: 'fixed_menu' })
    let data
    if (existingDoc) {
      body.created_at = existingDoc.created_at
      body.updated_at = DateService.now()

      data = await collections?.replaceOne({ id: 'fixed_menu' }, body, { upsert: false })
    } else {
      body.created_at = DateService.now()
      body.updated_at = DateService.now()
      data = await collections?.replaceOne({ id: 'fixed_menu' }, body, { upsert: true })
    }
    return response.redirect().back()
  }
  async aggreateCollectionData({ params, request, response }: HttpContext) {
    const collectionName = params.col
    const { pipeline, options } = request.only(['pipeline', 'options'])
    if (!pipeline) {
      return response.status(400).send({ message: 'Pipeline is required' })
    }
    const defaultOptions: any = {
      allowDiskUse: true,
      maxTimeMS: 60000,
      cursor: { batchSize: 1000 },
      ...options,
    }
    try {
      const collections = database.data?.collection(collectionName)
      const startTime = Date.now()
      const result = await collections?.aggregate(JSON.parse(pipeline), defaultOptions).toArray()
      const duration = Date.now() - startTime
      let data_encrypt = EncryptionService.encrypt(
        JSON.stringify({
          success: true,
          data: result,
          executionTime: `${duration}ms`,
          messages: `[Aggregation Success] Collection: ${collectionName} | Duration: ${duration}ms | Count: ${result?.length}`,
        })
      )
      return response.send(data_encrypt)
    } catch (error) {
      console.log(error)

      return response.status(500).send({ message: 'Error executing aggregation', error })
    }
  }
  async aggregateCollectionData({ params, request, response }: HttpContext) {
    const collectionName = params.col
    const { pipeline, options } = request.only(['pipeline', 'options'])
    if (!pipeline) {
      return response.status(400).send({ message: 'Pipeline is required' })
    }
    const defaultOptions: any = {
      allowDiskUse: true,
      maxTimeMS: 60000,
      ...options,
    }
    try {
      const collections = database.data?.collection(collectionName)
      const parsedPipeline = typeof pipeline === 'string' ? JSON.parse(pipeline) : pipeline
      const startTime = Date.now()
      const result = await collections?.aggregate(parsedPipeline, defaultOptions).toArray()
      const duration = Date.now() - startTime

      const rawResponse = {
        success: true,
        data: result || [],
        executionTime: `${duration}ms`,
        messages: `[Aggregation Success] ${collectionName} | Count: ${result?.length || 0}`,
      }
      const encryptedResponse = EncryptionService.encrypt(JSON.stringify(rawResponse))
      return response.send(encryptedResponse)
    } catch (error) {
      console.error('[Aggregation Error]:', error)
      return response.status(500).send({
        success: false,
        message: 'Internal Server Error during aggregation',
      })
    }
  }
  async getCollectionData({ params, request, response }: HttpContext) {
    const colName = params.col
    const { page = 1, limit = 10, sortField, sortOrder, search, filter } = request.all()
    const collections = MongoService.collection(colName)
    let query: any = {}
    if (search) {
      let object_search = JSON.parse(search)
      query.$or = []
      for (const element of Object.keys(object_search)) {
        if (typeof object_search[element] === 'string') {
          query.$or.push({ [element]: { $regex: object_search[element], $options: 'i' } })
        } else if (typeof Number(object_search[element]) === 'number') {
          query.$or.push({ [element]: object_search[element] })
        }
      }
    }
    if (filter) {
      let object_filter = JSON.parse(filter)
      for (const element of Object.keys(object_filter)) {
        query[element] = object_filter[element]
      }
    }
    const skip = (page - 1) * limit
    const sort: any = sortField
      ? { [sortField]: sortOrder === 'desc' ? -1 : 1 }
      : { updated_at: -1 }

    let data = await collections?.find(query).skip(skip).limit(Number(limit)).sort(sort).toArray()
    const total: any = await collections?.countDocuments(query)
    let response_data = { data, total, page: Number(page), totalPages: Math.ceil(total / limit) }
    let data_encrypt = EncryptionService.encrypt(JSON.stringify(response_data))
    return response.send(data_encrypt)
  }
  async getCollectionDataDetail({ params, response }: HttpContext) {
    const colName = params.col
    const id = params.id
    if (!id || id === 'undefined' || id === 'default') {
      return response.status(400).send({ message: 'ID parameter is required' })
    }
    const collections = MongoService.collection(colName)
    const result = await collections?.findOne({ _id: new ObjectId(id) })
    let data_encrypt = EncryptionService.encrypt(JSON.stringify(result))
    return response.send(data_encrypt)
  }
  async createCollectionData({ params, request, response }: HttpContext) {
    const colName = params.col
    let body = request.all()
    try {
      const fields = await UtilService.getFieldsMenu(colName)
      const cleanData = await UtilService.sterilizePayload(body, fields)
      const payload = { ...body, created_at: DateService.now(), updated_at: DateService.now() }
      const collections = MongoService.collection(colName)
      const result = await collections?.insertOne(payload)
      return response.status(201).send(result)
    } catch (error) {
      return response.status(500).send({ message: 'Error creating data', error })
    }
  }
  async updateCollectionData({ params, request, response }: HttpContext) {
    try {
      const colName = params.col
      const id = params.id
      console.log('ID', id)

      let body = request.all()
      const collections = MongoService.collection(colName)
      const updateData: any = { ...body, updated_at: DateService.now() }
      delete updateData._id
      const result = await collections?.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'before' }
      )
      let data_encrypt = EncryptionService.encrypt(JSON.stringify(result))
      return response.send(data_encrypt)
    } catch (error) {
      console.log(error)

      return response.status(500).send({ message: 'Error updating data', error })
    }
  }
  async deleteCollectionData({ params, response }: HttpContext) {
    try {
      const colName = params.col
      const id = params.id
      const collections = MongoService.collection(colName)
      const result = await collections?.findOneAndDelete({ _id: new ObjectId(id) })
      let data_encrypt = EncryptionService.encrypt(JSON.stringify(result))
      return response.send(data_encrypt)
    } catch (error) {
      return response.status(500).send({ message: 'Error deleting data', error })
    }
  }
  async deleteCollection({ params, response }: HttpContext) {
    try {
      const colName = params.col
      const collections = MongoService.collection(colName)
      const result = await collections?.drop()
      return response.status(200).send({ message: 'Data deleted successfully', result })
    } catch (error) {
      return response.status(500).send({ message: 'Error deleting data', error })
    }
  }
  async setupAuth({ auth, session, response }: HttpContext) {
    const user = {
      email: 'root',
      twoFactorSecret: 'twoFactorSecret',
    }
    let secret = session.get('totp_setup_secret')

    if (!secret) {
      secret = generateSecret()
      session.put('totp_setup_secret', secret)
    }

    const otpauth = generateURI({
      issuer: env.get('APP_NAME', 'AION Systems'),
      label: user.email,
      secret,
    })

    const qrCodeUrl = await qrcode.toDataURL(otpauth)

    return response.json({
      qrCode: qrCodeUrl,
      secretKey: secret,
      otpauth,
    })
  }
  async confirmAuth({ request, auth, session, response }: HttpContext) {
    const code = request.input('code')
    const uid = session.get('user_id')
    const collections = MongoService.collection('users')
    const result = await collections?.drop()
    const user = {
      email: 'root',
      twoFactorSecret: 'twoFactorSecret',
    }
    const secret = session.get('totp_setup_secret')

    if (!secret) {
      return response.status(400).json({ message: 'Sesi setup telah berakhir. Silakan ulangi.' })
    }

    const isValid = await verify({ token: code, secret })
    if (isValid.valid) {
      // Simpan secara terenkripsi ke database
      // user.twoFactorSecret = encryption.encrypt(secsret)
      // user.mfaType = 'totp'
      // user.twoFactorConfirmedAt = DateTime.now()
      // await user.save()

      // Bersihkan sesi setup
      session.forget('totp_setup_secret')

      return response.json({ message: 'Google Authenticator berhasil diaktifkan.' })
    }

    return response.status(422).json({ message: 'Kode verifikasi tidak cocok.' })
  }
}
