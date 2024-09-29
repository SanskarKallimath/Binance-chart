import React, { useEffect, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import './App.css';


ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

const COINS = ['ethusdt', 'bnbusdt', 'dotusdt'];
const INTERVALS = ['1m', '3m', '5m'];

const App = () => {
  const [symbol, setSymbol] = useState(COINS[0]);
  const [interval, setInterval] = useState(INTERVALS[0]);
  const [chartData, setChartData] = useState([]);
  const [dataCache, setDataCache] = useState(() => {
    const savedData = localStorage.getItem('candlestickData');
    return savedData ? JSON.parse(savedData) : {};
  });

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const kline = data.k;


      const candlestick = {
        x: kline.t,
        o: parseFloat(kline.o),
        h: parseFloat(kline.h),
        l: parseFloat(kline.l),
        c: parseFloat(kline.c),
      };

    
      setDataCache((prevCache) => {
        const updatedCache = {
          ...prevCache,
          [symbol]: [...(prevCache[symbol] || []), candlestick],
        };
        localStorage.setItem('candlestickData', JSON.stringify(updatedCache));
        return updatedCache;
      });

   
      setChartData((prevData) => {
        const newData = [...prevData, candlestick];
        return newData.length > 50 ? newData.slice(-50) : newData;
      });
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval]);


  const handleCoinChange = (e) => {
    const newSymbol = e.target.value;
    setSymbol(newSymbol);
    setChartData(dataCache[newSymbol] || []);
  };

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
  };


  const chartDataset = {
    datasets: [
      {
        label: 'Candlestick Data',
        data: chartData.map((data) => ({
          x: new Date(data.x),
          o: data.o,
          h: data.h,
          l: data.l,
          c: data.c,
        })),
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1, 
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
        },
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 6, 
        },
        grid: {
          display: false, 
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price',
        },
        ticks: {
          maxTicksLimit: 5, 
        },
        grid: {
          display: false, 
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    elements: {
      candlestick: {
        width: 0.8, 
      },
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    barPercentage: 0.5, 
    categoryPercentage: 0.5,
  };
  

  return (
    <div className="app-container">
      <h1>Live Cryptocurrency Candlestick Chart</h1>
      <div className="controls">
        <select value={symbol} onChange={handleCoinChange}>
          {COINS.map((coin) => (
            <option key={coin} value={coin}>
              {coin.toUpperCase()}
            </option>
          ))}
        </select>
        <select value={interval} onChange={handleIntervalChange}>
          {INTERVALS.map((timeframe) => (
            <option key={timeframe} value={timeframe}>
              {timeframe}
            </option>
          ))}
        </select>
      </div>
      <div className="chart-wrapper">
        <Chart type="candlestick" data={chartDataset} options={options} />
      </div>
    </div>
  );
};

export default App;
