import { sha256 } from '@noble/hashes/sha2.js'
import {
  randomBytes,
  bytesToHex,
  utf8ToBytes,
  hexToBytes,
  bytesToUtf8,
} from '@noble/ciphers/utils.js'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'

const appKey = import.meta.env.VITE_APP_KEY

export class EncryptionService {
  private static SECRET_PASSPHRASE = appKey
  private static getKey(): Uint8Array {
    return sha256(utf8ToBytes(this.SECRET_PASSPHRASE))
  }

  static encrypt(text: string) {
    const key = this.getKey()
    const nonce = randomBytes(24)
    const cipher = xchacha20poly1305(key, nonce)
    const dataBytes = utf8ToBytes(text)
    const encryptedData = cipher.encrypt(dataBytes)
    return {
      nonce: bytesToHex(nonce),
      ciphertext: bytesToHex(encryptedData),
    }
  }

  static decrypt(nonceHex: string, ciphertextHex: string): string | null {
    try {
      const key = this.getKey()
      const nonce = hexToBytes(nonceHex)
      const ciphertext = hexToBytes(ciphertextHex)
      const cipher = xchacha20poly1305(key, nonce)
      const decryptedData = cipher.decrypt(ciphertext)
      return bytesToUtf8(decryptedData)
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }
}
