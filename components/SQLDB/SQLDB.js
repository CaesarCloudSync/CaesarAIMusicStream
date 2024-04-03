import {
    enablePromise,
    openDatabase,
  } from "react-native-sqlite-storage"
  
  // Enable promise for SQLite
  enablePromise(true)
  
  export const connectToDatabase = async () => {
    return openDatabase(
      { name: "caersaraimusicstream.db", location: "default" },
      () => {},
      (error) => {
        console.error(error)
        throw Error("Could not connect to database")
      }
    )
  }

  export const createTables = async (db) => {

    const SongIsUnavailableQuery = `
     CREATE TABLE IF NOT EXISTS SongIsUnavailable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        songid VARCHAR(255)
     )
    `
    try {
      await db.executeSql(SongIsUnavailableQuery)
    } catch (error) {
      console.error(error)
      throw Error(`Failed to create tables`)
    }
  }

  export const getTableNames = async (db) => {
    try {
      const tableNames= []
      const results = await db.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      results?.forEach((result) => {
        for (let index = 0; index < result.rows.length; index++) {
          tableNames.push(result.rows.item(index).name)
        }
      })
      return tableNames
    } catch (error) {
      console.error(error)
      throw Error("Failed to get table names from database")
    }
  }
  
  export const removeTable = async (db, tableName) => {
    const query = `DROP TABLE IF EXISTS ${tableName}`
    try {
      await db.executeSql(query)
    } catch (error) {
      console.error(error)
      throw Error(`Failed to drop table ${tableName}`)
    }
  }

  export const addContact = async (db, songid) => {
    const insertQuery = `
     INSERT INTO SongIsUnavailable (songid)
     VALUES (?)
   `
    const values = [
        songid
    ]
    try {
      return db.executeSql(insertQuery, values)
    } catch (error) {
      console.error(error)
      throw Error("Failed to add contact")
    }
  }

  export const getAllSongIsUnavailable = async (db) => {
    try {
      const SongIsUnavailable = []
      const results = await db.executeSql("SELECT * FROM SongIsUnavailable")
      results?.forEach((result) => {
        for (let index = 0; index < result.rows.length; index++) {
          SongIsUnavailable.push(result.rows.item(index))
        }
      })
      return SongIsUnavailable
    } catch (error) {
      console.error(error)
      throw Error("Failed to get SongIsUnavailable from database")
    }
  }
  export const getSongIsUnavailable = async (db,songid) => {
    try {
      const SongIsUnavailable = []
      const values = [songid]
      const results = await db.executeSql("SELECT * FROM SongIsUnavailable WHERE songid = ?",values)
      results?.forEach((result) => {
        for (let index = 0; index < result.rows.length; index++) {
          SongIsUnavailable.push(result.rows.item(index))
        }
      })
      return SongIsUnavailable
    } catch (error) {
      console.error(error)
      throw Error("Failed to get SongIsUnavailable from database")
    }
  }

  export const updateContact = async (
    db,
    newsongid,
    oldsongid
  ) => {
    const updateQuery = `
      UPDATE SongIsUnavailable
      SET firstName = ?
      WHERE id = ?
    `
    const values = [
        newsongid,
        oldsongid
    ]
    try {
      return db.executeSql(updateQuery, values)
    } catch (error) {
      console.error(error)
      throw Error("Failed to update contact")
    }
  }

  export const deleteContact = async (db,songid) => {
    const deleteQuery = `
      DELETE FROM SongIsUnavailable
      WHERE id = ?
    `
    const values = [songid]
    try {
      return db.executeSql(deleteQuery, values)
    } catch (error) {
      console.error(error)
      throw Error("Failed to remove contact")
    }
  }