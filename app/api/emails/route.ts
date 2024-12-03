import { MongoClient, ServerApiVersion } from "mongodb";

const mongoUri = "mongodb+srv://ktanaka:j94ry2f8gmt0Fihb@cluster0.xr0e8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function GET() {
  try {
    await client.connect();
    const db = client.db("emails");
    console.log(`db=${db}`)
    const collection = db.collection("importantEmails");
    console.log(`collection=${collection}`)
    // 最新のメールデータを取得
    const emails = await collection.find({}).sort({ timestamp: -1 }).toArray();
    console.log(emails.length)
    return new Response(JSON.stringify(emails), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error retrieving emails:", error);
    return new Response("Error retrieving emails", { status: 500 });
  } finally {
    await client.close();
  }
}
