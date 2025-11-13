const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nzk3833.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Collections
const database = client.db("homeNestDB");
const propertyCollection = database.collection("properties");
const reviewCollection = database.collection("reviews");

async function run() {
  try {
    // await client.connect();  // Recommended to keep commented for serverless/Vercel

    console.log("Pinged your deployment. Successfully connected to MongoDB!");

    //=================================================
    //                 Property API
    //=================================================

    // 1. CREATE Property
    app.post('/properties', async (req, res) => {
        const newProperty = req.body;
        newProperty.createdAt = new Date();
        const result = await propertyCollection.insertOne(newProperty);
        res.send(result);
    });

    // 2. READ (All Properties)
    app.get('/properties', async (req, res) => {
        let query = {};
        let sortOptions = {};

        if (req.query.search) {
            query.propertyName = { $regex: req.query.search, $options: 'i' };
        }

        if (req.query.sort === 'price-asc') {
            sortOptions.price = 1;
        } else if (req.query.sort === 'price-desc') {
            sortOptions.price = -1;
        }

        const properties = await propertyCollection.find(query).sort(sortOptions).toArray();
        res.send(properties);
    });

    // 3. READ (Featured Properties)
    app.get('/properties/featured', async (req, res) => {
        const featuredProperties = await propertyCollection
            .find()
            .sort({ createdAt: -1 })
            .limit(6)
            .toArray();
        res.send(featuredProperties);
    });

    // 4. READ (My Properties by Email)
    app.get('/properties/my', async (req, res) => {
        const email = req.query.email;
        if (!email) {
            return res.status(400).send({ error: "Email query is required" });
        }

        const query = { userEmail: email };
        const myProperties = await propertyCollection.find(query).toArray();
        res.send(myProperties);
    });

    // 5. READ (Single Property)
    app.get('/properties/:id', async (req, res) => {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ error: "Invalid ID format" });
        }

        const query = { _id: new ObjectId(id) };
        const property = await propertyCollection.findOne(query);
        res.send(property);
    });

    // 6. UPDATE Property
    app.put('/properties/:id', async (req, res) => {
        const id = req.params.id;
        const updatedData = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                propertyName: updatedData.propertyName,
                description: updatedData.description,
                category: updatedData.category,
                price: updatedData.price,
                location: updatedData.location,
                imageLink: updatedData.imageLink,
            },
        };

        const result = await propertyCollection.updateOne(filter, updateDoc);
        res.send(result);
    });

    // 7. DELETE Property
    app.delete('/properties/:id', async (req, res) => {
        const id = req.params.id;

        const query = { _id: new ObjectId(id) };
        const result = await propertyCollection.deleteOne(query);
        res.send(result);
    });

//=================================================
    //                Review API
    //=================================================

    // 1. CREATE Review
    app.post('/reviews', async (req, res) => {
        const newReview = req.body;
        newReview.createdAt = new Date();
        const result = await reviewCollection.insertOne(newReview);
        res.send(result);
    });

    // 2. READ (All Reviews for a Property)
    app.get('/reviews/:propertyId', async (req, res) => {
        const propertyId = req.params.propertyId;
        const query = { propertyId: propertyId };
        const reviews = await reviewCollection.find(query).sort({ createdAt: -1 }).toArray();
        res.send(reviews);
    });

    // 3. READ (Reviews by User Email)
    app.get('/reviews/my/:email', async (req, res) => {
        const email = req.params.email;
        const query = { reviewerEmail: email };
        const myReviews = await reviewCollection.find(query).toArray();
        res.send(myReviews);
    });

  } finally {
    // await client.close();
  }
}

run().catch(console.dir);




    
    

// Start Server
app.listen(port, () => {
    console.log(`HomeNest Server running on port ${port}`);
});
