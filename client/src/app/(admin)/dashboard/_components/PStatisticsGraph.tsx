import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

const data = [
  { month: 'Jan', value: 50 },
  { month: 'Feb', value: 40 },
  { month: 'Mar', value: 60 },
  { month: 'Apr', value: 75 },
  { month: 'May', value: 95 },
  { month: 'Jun', value: 70 },
  { month: 'Jul', value: 65 },
  { month: 'Aug', value: 80 },
  { month: 'Sep', value: 90 },
  { month: 'Oct', value: 85 },
  { month: 'Nov', value: 78 },
  { month: 'Dec', value: 88 }
];

const PStatisticsGraph = () => {
  return (
    <Card className="p-4 rounded-2xl shadow-md ">
      <CardContent>
        <h2 className="text-xl font-bold mb-2">P. Statistics</h2>
        <p className="text-gray-500 mb-4">Analytic Data</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7f68f3" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7f68f3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#7f68f3" fillOpacity={1} fill="url(#colorUv)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PStatisticsGraph;
