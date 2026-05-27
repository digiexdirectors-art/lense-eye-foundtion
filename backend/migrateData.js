const mongoose = require('mongoose');

// Remote and Local URIs
const remoteURI = "mongodb://eyenova_app:4kyyiqsJ1LV@213.210.36.24:27017/eyenova";
const localURI = "mongodb://127.0.0.1:27017/eyenova";

async function migrate() {
    console.log('Starting data migration from Remote to Local...');
    
    try {
        const collections = [
            'appointments', 'billcumreceipts', 'inventories', 'moneyreceipts', 
            'patients', 'prescriptions', 'purchaseinvoices', 'registrationbills', 
            'salesbills', 'sequences', 'settings', 'users'
        ];

        console.log('Connecting to Remote DB...');
        const remoteConn = await mongoose.createConnection(remoteURI).asPromise();
        console.log('Connecting to Local DB...');
        const localConn = await mongoose.createConnection(localURI).asPromise();

        for (const collName of collections) {
            console.log(`\nMigrating ${collName}...`);
            const data = await remoteConn.db.collection(collName).find({}).toArray();
            
            if (data.length > 0) {
                // Clear local data first
                await localConn.db.collection(collName).deleteMany({});
                // Insert remote data
                await localConn.db.collection(collName).insertMany(data);
                console.log(`✓ Successfully migrated ${data.length} records for ${collName}`);
            } else {
                console.log(`! No records found for ${collName} on remote server.`);
            }
        }

        console.log('\n=========================================');
        console.log('MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('All your data is now on your local computer.');
        console.log('=========================================');

        await remoteConn.close();
        await localConn.close();
        process.exit(0);
    } catch (error) {
        console.error('\nCRITICAL MIGRATION ERROR:', error);
        process.exit(1);
    }
}

migrate();
