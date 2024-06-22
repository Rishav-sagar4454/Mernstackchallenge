import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionsTable from './components/TransactionsTable';
import Statistics from './components/Statistics';
import BarChartComponent from './components/BarChartComponent';
import PieChartComponent from './components/PieChartComponent';

const App = () => {
  const [month, setMonth] = useState('March');
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/transactions?month=${month}`);
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    const fetchStatistics = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/statistics?month=${month}`);
        setStatistics(response.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    const fetchBarChartData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/barchart?month=${month}`);
        setBarChartData(response.data);
      } catch (error) {
        console.error('Error fetching bar chart data:', error);
      }
    };

    const fetchPieChartData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/piechart?month=${month}`);
        setPieChartData(response.data);
      } catch (error) {
        console.error('Error fetching pie chart data:', error);
      }
    };

    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
    fetchPieChartData();
  }, [month]);

  return (
    <div>
      <h1>MERN Stack Coding Challenge</h1>
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <TransactionsTable transactions={transactions} month={month} />
      <Statistics statistics={statistics} />
      <BarChartComponent data={barChartData} />
      <PieChartComponent data={pieChartData} />
    </div>
  );
};

export default App;
