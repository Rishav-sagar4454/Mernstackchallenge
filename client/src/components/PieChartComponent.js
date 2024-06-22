// src/components/PieChartComponent.js
import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';

const PieChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;
