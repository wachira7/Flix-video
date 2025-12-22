
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flixvideo';

const collections = [
  {
    name: 'user_preferences',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'created_at'],
        properties: {
          user_id: { bsonType: 'string', description: 'User UUID from PostgreSQL' },
          theme: { enum: ['light', 'dark', 'auto'] },
          language: { bsonType: 'string' },
          content_preferences: { bsonType: 'object' },
          notification_settings: { bsonType: 'object' },
          privacy_settings: { bsonType: 'object' },
          playback_settings: { bsonType: 'object' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1 }, unique: true },
      { key: { updated_at: -1 } }
    ]
  },
  {
    name: 'user_activity_logs',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'action', 'timestamp'],
        properties: {
          user_id: { bsonType: 'string' },
          action: { bsonType: 'string' },
          content_type: { enum: ['movie', 'tv_show', 'episode', null] },
          content_id: { bsonType: ['long', 'null'] },
          metadata: { bsonType: 'object' },
          ip_address: { bsonType: 'string' },
          user_agent: { bsonType: 'string' },
          timestamp: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1, timestamp: -1 } },
      { key: { action: 1, timestamp: -1 } },
      { key: { timestamp: -1 }, expireAfterSeconds: 7776000 } // 90 days TTL
    ]
  },
  {
    name: 'ai_conversations',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'messages', 'created_at'],
        properties: {
          user_id: { bsonType: 'string' },
          session_id: { bsonType: 'string' },
          messages: { bsonType: 'array' },
          context: { bsonType: 'object' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1, updated_at: -1 } },
      { key: { session_id: 1 } },
      { key: { created_at: -1 } }
    ]
  },
  {
    name: 'recommendation_metadata',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'content_type', 'content_id'],
        properties: {
          user_id: { bsonType: 'string' },
          content_type: { enum: ['movie', 'tv_show'] },
          content_id: { bsonType: 'long' },
          recommendation_score: { bsonType: 'double' },
          reasons: { bsonType: 'array' },
          algorithm: { bsonType: 'string' },
          metadata: { bsonType: 'object' },
          created_at: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1, recommendation_score: -1 } },
      { key: { content_type: 1, content_id: 1 } },
      { key: { created_at: -1 } }
    ]
  },
  {
    name: 'watch_sessions',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'content_type', 'content_id', 'started_at'],
        properties: {
          user_id: { bsonType: 'string' },
          content_type: { enum: ['movie', 'tv_show', 'episode'] },
          content_id: { bsonType: 'long' },
          season_number: { bsonType: ['int', 'null'] },
          episode_number: { bsonType: ['int', 'null'] },
          duration_seconds: { bsonType: 'int' },
          progress_seconds: { bsonType: 'int' },
          completed: { bsonType: 'bool' },
          device_type: { bsonType: 'string' },
          quality: { bsonType: 'string' },
          started_at: { bsonType: 'date' },
          ended_at: { bsonType: 'date' },
          pauses: { bsonType: 'array' },
          buffering_events: { bsonType: 'array' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1, started_at: -1 } },
      { key: { content_type: 1, content_id: 1 } },
      { key: { started_at: -1 } }
    ]
  },
  {
    name: 'search_history',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'query', 'timestamp'],
        properties: {
          user_id: { bsonType: 'string' },
          query: { bsonType: 'string' },
          filters: { bsonType: 'object' },
          results_count: { bsonType: 'int' },
          clicked_content: { bsonType: 'array' },
          timestamp: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1, timestamp: -1 } },
      { key: { query: 'text' } },
      { key: { timestamp: -1 }, expireAfterSeconds: 15552000 } // 180 days TTL
    ]
  },
  {
    name: 'content_embeddings',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['content_type', 'content_id', 'embedding'],
        properties: {
          content_type: { enum: ['movie', 'tv_show'] },
          content_id: { bsonType: 'long' },
          embedding: { bsonType: 'array' },
          model_version: { bsonType: 'string' },
          metadata: { bsonType: 'object' },
          created_at: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { content_type: 1, content_id: 1 }, unique: true },
      { key: { model_version: 1 } }
    ]
  },
  {
    name: 'user_clusters',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'cluster_id'],
        properties: {
          user_id: { bsonType: 'string' },
          cluster_id: { bsonType: 'int' },
          cluster_name: { bsonType: 'string' },
          similarity_score: { bsonType: 'double' },
          features: { bsonType: 'object' },
          similar_users: { bsonType: 'array' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { user_id: 1 }, unique: true },
      { key: { cluster_id: 1 } },
      { key: { updated_at: -1 } }
    ]
  }
];

async function initializeMongoDB() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    for (const collectionDef of collections) {
      console.log(`📦 Creating collection: ${collectionDef.name}`);

      // Create collection with validator
      try {
        await db.createCollection(collectionDef.name, {
          validator: collectionDef.validator
        });
        console.log(`  ✅ Collection created`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`  ⚠️  Collection already exists`);
        } else {
          throw error;
        }
      }

     // Create indexes
      const collection = db.collection(collectionDef.name);
      for (const index of collectionDef.indexes) {
        const options = { 
          unique: index.unique || false
        };
        
        // Only add expireAfterSeconds if it exists
        if (index.expireAfterSeconds !== undefined) {
          options.expireAfterSeconds = index.expireAfterSeconds;
        }
        
        await collection.createIndex(index.key, options);
      }
      console.log(`  ✅ Indexes created\n`);
    }

    // List all collections
    const allCollections = await db.listCollections().toArray();
    console.log('📋 All MongoDB Collections:');
    allCollections.forEach(col => console.log(`  - ${col.name}`));

    console.log('\n🎉 MongoDB initialization complete!');

  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initializeMongoDB();
