import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';
import * as url from 'url';
import { MongoClient, ServerApiVersion } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
// メッセージヘッダーの型を定義

const mongoUri="mongodb+srv://ktanaka:j94ry2f8gmt0Fihb@cluster0.xr0e8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(mongoUri, {
  serverApi:{
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function clearDatabase() {
  try {
    await client.connect();
    const db = client.db("emails");
    const collection = db.collection("importantEmails");

    // コレクションの内容をすべて削除
    const result = await collection.deleteMany({});
    console.log(`Cleared ${result.deletedCount} documents from the collection.`);
  } catch (error) {
    console.error("Error clearing MongoDB collection:", error);
  } finally {
    await client.close();
  }
}

async function saveToDatabase(subject: string, body: string, importance: string){
  try{
    await client.connect();
    const detabese = client.db("emails");
    const collection = detabese.collection("importantEmails");

    const result = await collection.insertOne({
      subject,
      body,
      importance,
      timestamp: new Date(),
    });
    console.log(`Inserted document with _id: ${result.insertedId}`);
  }catch (error) {
    console.error("Error saving to MongoDB:", error);
  } finally {
    await client.close();
  }
}


export async function GET(request: NextRequest) {

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  const q = url.parse(request.url, true).query;
  //console.log(q)
  // url.parse(request.url, true)⇒リクエストのURLを解析し、クエリパラメータをオブジェクト形式で返す
  // [Object: null prototype] {
  //   code: '4/0AeanS0YZTb-ivwcT4bQVfFbGUP8OtioVGYf1wbHfxLEMkoUv-1bI3oOfQqleWzE_VYPEMg',
  //   scope: 'https://www.googleapis.com/auth/gmail.readonly'
  // }
  if (q.error) {//クエリキーにエラーが含まれるか
    console.log('Error:' + q.error);
    return NextResponse.redirect(new URL("/", request.url));
    //エラー検出でルートページへリダイレクト
  }
  //トークン獲得
  const code = q.code as string;
  // console.log(code);
  //認可コードを使用してアクセストークンとリフレッシュトークンを取得
  const { tokens } = await oauth2Client.getToken(code);
  // console.log(tokens)
  // {
  //   access_token: 'ya29.a0AeDClZB_uojVXJ6k9dzCyyPJUXAkh31CMnxZXsXjFZXjhUxE2su5WvJLlWXADKKrZ6MbEVpABpVKNU1q364XtqwGDrQz3WJUgVHD1p-KaiaG1rTtGZXv0r0svT68KSBEoA23oV3y3oD9cKbHpKTC2yv9VE-Cud8T1yYaCgYKAX0SARISFQHGX2MiUN8k8BU0hs5cwyg1sndgBA0170',
  //   scope: 'https://www.googleapis.com/auth/gmail.readonly',
  //   token_type: 'Bearer',
  //   expiry_date: 1733194688211
  // }

  //トークンをクライアントに設定
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  //console.log(gmail);
  try {
     // まず、データベースを初期化（削除）
     await clearDatabase();
    // Gmail のメッセージ一覧を取得
    const res = await gmail.users.messages.list({
      userId: "me", // "me" は認証されたユーザー自身を指します
      labelIds: ["INBOX"], // 必要に応じてラベルを指定（例：INBOX）
      maxResults: 10,
    });
    //console.log(res.data)

    const messages = res.data.messages;

    if (messages && messages.length > 0) {

      const subjects = [];
      const bodys = [];
      let count=0;
      let index=5;
      // メッセージを取得
      console.log("メッセージ取得開始")
      for (const message of messages){
        const messageDetail = await gmail.users.messages.get({
          userId:"me",
          id: message.id as string,
        });
        //console.log(messageDetail.data.payload)
        //本文出力
        const payload = messageDetail.data.payload;
        const body = payload?.parts?payload.parts[0]?.body?.data:payload?.body?.data;
        const encodeBody = body ? Buffer.from(body, "base64").toString("utf-8") : "No content"; 
        const textContent = encodeBody.replace(/<[^>]+>/g, '').trim();
        //console.log(textContent);
        //件名出力
        const subjectHeader = messageDetail.data.payload?.headers?.find(
          (header) => header.name === "Subject"
        );
        // const messageBody = messageDetail.data.payload?.body?.data;
        // console.log(messageBody)
        


        if(subjectHeader){
          subjects.push(subjectHeader.value);
        }
        if(textContent){
          bodys.push(textContent);
        }
        count++;
        if(count===index){
          console.log(`${count}件取得完了`)
          index+=5
        }

      }
      count=0
      index=5
      //console.log(`Message subject: ${message.data.snippet}`);
      // console.log(`Subjects of first ${subjects.length} unread messages:`);
      // subjects.forEach((subject, index) => {
      //   console.log(`${index + 1}: ${subject}`);
      // });
      const important=[];
      console.log("gpt読み込ませ開始")
      for(let i = 0; i < bodys.length; i++){
        //ここでGPTを使ってそのヘッダーの重要度をリストに追加したい
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: "あなたはメールの内容に基づいて、メールの重要度を判断します。" },
            { role: "system", content: "出力は重要度を0から100の数値とし、その数値のみを出力してください。" },
            { role: "system", content: "一斉送信のメールの重要度は下げてください" },
            { role: "user", content: `以下のメールの重要度を教えてください.件名はこれです: ${subjects[i]}, 本文はこれです:${bodys[i]}` },
          ],
        });

        const importance = gptResponse.choices[0]?.message?.content?.trim() || "Unknown";

        // 重要度をリストに追加
        //important.push({ subject:subjects[i], body:bodys[i], importance });
        important.push({ importance });
        count++;
        if(count===index){
          console.log(`${count}件読み込ませ完了`)
          index+=5
        }
        await saveToDatabase(subjects[i], bodys[i], importance)
      }
      console.log("gpt読み込ませ完了")
      const redirectUrl = new URL("/display", request.url);
      redirectUrl.searchParams.set("emails", JSON.stringify(important));
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log("No unread messages.");
      return NextResponse.json({ message: "No unread messages." });
    }
  } catch (error) {
    console.error("Error retrieving Gmail messages:", error);
    return NextResponse.json({ error: "Error retrieving Gmail messages" });
  }
  // let userCredential: { access_token: string; refresh_token: string;} = { access_token: "", refresh_token: ""};
  // userCredential = tokens;

  // console.log(`access_token: ${userCredential.access_token}`);
  // console.log(`refresh_token: ${userCredential.refresh_token}`);

  //return NextResponse.redirect(new URL("/", request.url));
}