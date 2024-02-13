const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Schema } = mongoose;
const { Types } = require('mongoose');


const Size = global.Size;
const app = express();
const PORT = process.env.PORT || 3050;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// const mongoDBAtlasIP = 'mongodb+srv://mubashirhussain:ZNbjJ8gy1SHvPFEU@cluster0.a1bvhv9.mongodb.net/?retryWrites=true&w=majority';
// mongoose.connect(`${mongoDBAtlasIP}brontobyteDB`).then(() => {
//     console.log("mongodb connected")
// });

const mongoDBAtlasIP = 'mongodb+srv://mubashirhussain:ZNbjJ8gy1SHvPFEU@cluster0.a1bvhv9.mongodb.net/';

mongoose.connect(`${mongoDBAtlasIP}brontobyteDB`);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


const meterReadingSchema = new mongoose.Schema({
    Routes: {
        type: String,
        required: true
    },
    AccNr: {
        type: Number,
        required: true
    },
    MetType: {
        type: String,
        enum: ['ME01', 'ME03'],
        required: true
    },
    SeqNo: {
        type: Number,
        required: true
    },
    MtNr: {
        type: Number,
        required: true
    },
    CurrRead: {
        type: Number,
        required: true
    },
    PrevRead: {
        type: Number,
        required: true
    },
    AccName: {
        type: String,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    PreDec: {
        type: Number,
        required: true
    },
    PostDec: {
        type: Number,
        required: true
    },
    BillFactor: {
        type: Number,
        required: true
    },
    Resettable: {
        type: Boolean,
        required: false
    },
    Consumption: {
        type: Number,
        required: true
    }
});

const MeterReading = mongoose.model('meterreading', meterReadingSchema);


app.get('/api/getAllRoutes', async (req, res) => {
    try {
        const routes = await MeterReading.find().distinct('Routes');
        res.status(200).json({ routes });
    } catch (error) {
        console.error('Error getting routes:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/api/getRoute/:route', async (req, res) => {
    try {
        const route = req.params.route;
        const routes = await MeterReading.find({ Routes: route });

        if (!routes) {
            return res.status(404).json({ error: 'Route not found for the specified route' });
        }

        res.status(200).json({ meters: routes });
    } catch (error) {
        console.error('Error getting route:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/api/getAccountDetails/:accNr', async (req, res) => {
    try {
        const accNr = req.params.accNr;
        const accounts = await MeterReading.find({ 'AccNr': Number(accNr) });

        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ error: 'No accounts found for the specified account number' });
        }

        res.status(200).json({ accounts });
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


app.post('/api/updateReadings', async (req, res) => {
    try {
        const mtNr = req.body.mtNr;
        // const kva = req.body.kva;
        const currentKwh = req.body.currentKwh;
        const account = await MeterReading.findOne({ 'MtNr': Number(mtNr), 'MetType': "ME01" });
        if (!account || account.length === 0) {
            return res.status(404).json({ error: 'No account found for the specified account number' });
        }
        if (account && currentKwh > account.CurrRead) {
            const MtrConsumption = currentKwh - account.CurrRead;
            const result = await MeterReading.findOneAndUpdate(
                { 'MtNr': Number(mtNr), 'MetType': "ME01" },
                { $set: { 'CurrRead': currentKwh, 'PrevRead': account.CurrRead, 'Consumption': MtrConsumption } }, { new: true }
            );
            return res.status(200).json({ accounts: result });
        } else {
            return res.status(422).json({ accounts: {} });
        }
        // res.status(200).json({ account: account });
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

