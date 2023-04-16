import React, { useEffect } from 'react';
import { createStore, applyMiddleware } from 'redux';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createSlice, configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Layout, Typography } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

const bitcoinSlice = createSlice({
name: 'bitcoin',
initialState: {
price: null,
history: [],
isLoading: false,
error: null,
},
reducers: {
fetchBitcoinDataStart: (state) => {
state.isLoading = true;
},
fetchBitcoinDataSuccess: (state, action) => {
state.isLoading = false;
state.price = action.payload.price;
state.history = action.payload.history;
},
fetchBitcoinDataError: (state, action) => {
state.isLoading = false;
state.error = action.payload;
},
},
});

const { actions, reducer } = bitcoinSlice;

const fetchBitcoinData = () => async (dispatch) => {
dispatch(actions.fetchBitcoinDataStart());

try {
const [priceRes, historyRes] = await Promise.all([
axios.get('https://api.coindesk.com/v1/bpi/currentprice/BTC.json'),
axios.get('https://api.coindesk.com/v1/bpi/historical/close.json?currency=BTC&start=365&end=1'),
]);

dispatch(
  actions.fetchBitcoinDataSuccess({
    price: priceRes.data.bpi.USD.rate_float.toFixed(2),
    history: historyRes.data.bpi,
  })
);
} catch (error) {
dispatch(actions.fetchBitcoinDataError(error.message));
}
};

const store = configureStore({ reducer: { bitcoin: reducer }, middleware: [thunk] });

const BitcoinGraph = () => {
const dispatch = useDispatch();
const data = useSelector((state) => state.bitcoin);

useEffect(() => {
dispatch(fetchBitcoinData());
}, [dispatch]);

const graphData = {
labels: Object.keys(data.history),
datasets: [
{
label: 'BTC Price',
data: Object.values(data.history),
borderColor: '#58a6ff',
backgroundColor: 'rgba(88, 166, 255, 0.1)',
},
],
};

const graphOptions = {
scales: {
x: {
ticks: {
autoSkip: true,
maxTicksLimit: 12,
},
},
},
};

return (
<Layout>
<Header style={{ backgroundColor: '#232323', textAlign: 'center' }}>
<Title level={2} style={{ color: '#58a6ff' }}>
Bitcoin Price
</Title>
</Header>
<Content style={{ padding: '50px', backgroundColor: '#323232' }}>
{data.isLoading ? (
<Title level={3} style={{ color: '#58a6ff' }}>
Loading...
</Title>
) : data.error ? (
<Title level={3} style={{ color: '#ff4d4f' }}>
{data.error}
</Title>
) : (
<>
<Title level={3} style={{ color: '#58a6ff' }}>
Current Price: ${data.price}
</Title>
<Line data={graphData} options={graphOptions} />
</>
)}
</Content>
</Layout>
);
};

const App = () => {
return (
<Provider store={store}>
<BitcoinGraph />
</Provider>
);
};

export default App;
