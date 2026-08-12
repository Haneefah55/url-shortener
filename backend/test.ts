// test-connection.ts
import * as amqp from 'amqplib';
import 'dotenv/config'

async function test() {
	console.log(process.env.RABBITMQ_URL!);

	
		const conn = await amqp.connect(process.env.RABBITMQ_URL!);
  console.log('✅ Connected to CloudAMQP');
		
  await conn.close();
	
  
}
