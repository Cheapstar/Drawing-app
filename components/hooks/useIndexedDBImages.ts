import { useState, useEffect, useCallback } from "react";
import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define the database schema
export interface ImagesDBSchema extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
    indexes: { "by-date": number };
  };
}

export interface ImageRecord {
  id: string;
  blob: Blob;
  createdAt: number;
  base64?: string;
  name?: string;
}

const DB_NAME = "X-Draw";
const STORE_NAME = "images";
const DB_VERSION = 2;

export function useIndexedDBImages() {
  const [db, setDb] = useState<IDBPDatabase<ImagesDBSchema> | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the database
  useEffect(() => {
    const initDB = async () => {
      try {
        setIsLoading(true);
        const database = await openDB<ImagesDBSchema>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, {
                keyPath: "id",
              });
              store.createIndex("by-date", "createdAt");
            }
          },
        });

        setDb(database);
      } catch (err) {
        console.error("Failed to initialize IndexedDB:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    initDB();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  // Fetch all images from the database
  const fetchImages = useCallback(
    async (database: IDBPDatabase<ImagesDBSchema>) => {
      try {
        const allImages = await database.getAllFromIndex(STORE_NAME, "by-date");
        setImages(allImages);
        return allImages;
      } catch (err) {
        console.error("Error fetching images:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return [];
      }
    },
    []
  );

  // Store a new image
  const storeImage = useCallback(
    async (
      file: Blob,
      id: string,
      name?: string
    ): Promise<ImageRecord | null> => {
      if (!db) return null;

      try {
        // Check if key already exists or not
        const checkExist = await db.get("images", id);
        if (checkExist) {
          return checkExist;
        } else {
          const timestamp = Date.now();
          const imageRecord: ImageRecord = {
            id: id,
            blob: file,
            createdAt: timestamp,
            name: name || `image-${timestamp}`,
          };

          await db.add(STORE_NAME, imageRecord);
          return imageRecord;
        }
      } catch (err) {
        console.error("Error storing image:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [db, fetchImages]
  );

  const deleteImage = useCallback(
    async (id: string): Promise<boolean> => {
      if (!db) return false;

      try {
        await db.delete(STORE_NAME, id);
        return true;
      } catch (err) {
        console.error("Error deleting image:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [db]
  );

  // Get a single image by ID
  const getImage = useCallback(
    async (
      id: string,
      database?: IDBPDatabase<ImagesDBSchema> | null
    ): Promise<ImageRecord | null> => {
      // Use the instance db if no database is passed
      const dbToUse = database || db;

      if (!dbToUse) {
        console.error("Database connection not available");
        return null;
      }

      try {
        console.log(`Fetching image with ID: ${id}`);
        const record = await dbToUse.get(STORE_NAME, id);
        console.log("Image record found:", record ? "yes" : "no");
        return record as ImageRecord;
      } catch (err) {
        console.error(`Error getting image ${id}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [db]
  );

  // Clear all images
  const clearImages = useCallback(async (): Promise<boolean> => {
    if (!db) return false;

    try {
      await db.clear(STORE_NAME);
      return true;
    } catch (err) {
      console.error("Error clearing images:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [db]);

  return {
    images,
    db,
    storeImage,
    deleteImage,
    getImage,
    clearImages,
    isLoading,
    error,
    refreshImages: db ? () => fetchImages(db) : null,
  };
}
