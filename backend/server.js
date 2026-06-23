require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dishesData = require('./dishes.json'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST", "PUT"] }
});

app.use(cors());
app.use(express.json());


const dishSchema = new mongoose.Schema({
    dishId: { type: String, required: true, unique: true },
    dishName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isPublished: { type: Boolean, default: false }
});

const Dish = mongoose.model('Dish', dishSchema);


mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
    console.log("MongoDB Atlas Connected Successfully");
    
    
    const count = await Dish.countDocuments();
    if (count === 0) {
    await Dish.insertMany(dishesData);
    console.log("Atlas database seeded successfully with dishes.json");
    } else {
    console.log("Atlas database already contains data. Skipping seed.");
    }

    
    const changeStream = Dish.watch();
    
    changeStream.on('change', async (change) => {
    if (change.operationType === 'update' || change.operationType === 'replace') {
        
        const documentId = change.documentKey._id;
        const updatedDish = await Dish.findById(documentId);
        
        io.emit('dishUpdated', updatedDish);
    }
    });
    
})
    .catch(err => console.error("MongoDB Atlas Connection Error:", err));


app.get('/api/dishes', async (req, res) => {
    try {
    const dishes = await Dish.find();
    res.json(dishes);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
});

app.put('/api/dishes/:dishId/toggle', async (req, res) => {
    try {
    const dish = await Dish.findOne({ dishId: req.params.dishId });
    if (!dish) return res.status(404).json({ message: 'Dish not found' });

    dish.isPublished = !dish.isPublished;
    await dish.save();

    
    res.json(dish);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
});


io.on('connection', (socket) => {
    console.log('Client connected for real-time updates');
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));