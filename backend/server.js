const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const DB_URL = 'mongodb://localhost:27017/mernstackchallenge';

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true, // Use this option to avoid the MongoDB connection error
}).then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

  const transactionSchema = new mongoose.Schema({
    id: Number,
    title: String,
    price: Number,
    description: String,
    category: String,
    image: String,
    sold: Boolean,
    dateOfSale: Date
  });

const Transaction = mongoose.model('Transaction', transactionSchema);

app.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;
    await Transaction.deleteMany({});
    await Transaction.insertMany(transactions);
    res.status(200).send('Database initialized with seed data');
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).send('Error initializing database');
  }
});

app.get('/transactions', async (req, res) => {
  const { search, page = 1, perPage = 10, month } = req.query;
  const searchQuery = search ? {
    $or: [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { price: search }
    ]
  } : {};
  const dateQuery = month ? {
    dateOfSale: {
      $gte: new Date(`${month} 1`),
      $lt: new Date(new Date(`${month} 1`).setMonth(new Date(`${month} 1`).getMonth() + 1))
    }
  } : {};

  const query = { ...searchQuery, ...dateQuery };

  try {
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(Number(perPage));
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Error fetching transactions');
  }
});

app.get('/statistics', async (req, res) => {
  const { month } = req.query;
  const dateQuery = month ? {
    dateOfSale: {
      $gte: new Date(`${month} 1`),
      $lt: new Date(new Date(`${month} 1`).setMonth(new Date(`${month} 1`).getMonth() + 1))
    }
  } : {};

  try {
    const totalSaleAmount = await Transaction.aggregate([
      { $match: dateQuery },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalSoldItems = await Transaction.countDocuments({ ...dateQuery, sold: true });
    const totalNotSoldItems = await Transaction.countDocuments({ ...dateQuery, sold: false });

    res.json({
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].total : 0,
      totalSoldItems,
      totalNotSoldItems
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Error fetching statistics');
  }
});

app.get('/barchart', async (req, res) => {
  const { month } = req.query;
  const dateQuery = month ? {
    dateOfSale: {
      $gte: new Date(`${month} 1`),
      $lt: new Date(new Date(`${month} 1`).setMonth(new Date(`${month} 1`).getMonth() + 1))
    }
  } : {};

  const ranges = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
    { min: 701, max: 800 },
    { min: 801, max: 900 },
    { min: 901, max: Infinity }
  ];

  try {
    const barChartData = await Promise.all(ranges.map(async range => {
      const count = await Transaction.countDocuments({
        ...dateQuery,
        price: { $gte: range.min, $lte: range.max }
      });
      return { range: `${range.min}-${range.max}`, count };
    }));

    res.json(barChartData);
  } catch (error) {
    console.error('Error fetching bar chart data:', error);
    res.status(500).send('Error fetching bar chart data');
  }
});

app.get('/piechart', async (req, res) => {
  const { month } = req.query;
  const dateQuery = month ? {
    dateOfSale: {
      $gte: new Date(`${month} 1`),
      $lt: new Date(new Date(`${month} 1`).setMonth(new Date(`${month} 1`).getMonth() + 1))
    }
  } : {};

  try {
    const pieChartData = await Transaction.aggregate([
      { $match: dateQuery },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.json(pieChartData);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).send('Error fetching pie chart data');
  }
});

app.get('/combined', async (req, res) => {
  try {
    const statistics = await axios.get(`http://localhost:${PORT}/statistics`, { params: req.query });
    const barChart = await axios.get(`http://localhost:${PORT}/barchart`, { params: req.query });
    const pieChart = await axios.get(`http://localhost:${PORT}/piechart`, { params: req.query });

    res.json({
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data
    });
  } catch (error) {
    console.error('Error fetching combined data:', error);
    res.status(500).send('Error fetching combined data');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
