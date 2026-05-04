import '@testing-library/jest-dom'
import { IDBFactory } from 'fake-indexeddb'

beforeEach(() => {
  global.indexedDB = new IDBFactory()
})
