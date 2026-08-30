import mongoose from 'mongoose';
import dns from 'dns';

// Override default DNS servers with public Google and Cloudflare DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

const testConnection = async () => {
  const pass = encodeURIComponent('RkKeoGLXa2lZUTV4');
  const uri = `mongodb+srv://biswajitshial_db_user:${pass}@cluster0.viadhii.mongodb.net/opsmind-ai?retryWrites=true&w=majority&appName=Cluster0`;

  console.log('--- Database Connection Diagnostic (Public DNS) ---');
  console.log('Connecting to MongoDB Atlas via Google DNS...');
  
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('SUCCESS! Connected to MongoDB Atlas cluster successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.log(`Failed connection attempt: ${err.message}`);
    process.exit(1);
  }
};

testConnection();
