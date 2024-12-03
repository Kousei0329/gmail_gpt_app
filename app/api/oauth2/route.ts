import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  //GoogleのOAuth 2.0クライアントオブジェクト定義
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
  const authorizationUrl = oauth2Client.generateAuthUrl({
  //generateAuthUrl⇒GoogleへのリクエストURLを作成、
  //これにリダイレクトされるとユーザはGoogleアカウントを使用してアプリにアクセスを許可する画面表示
    access_type: 'offline',//リフレッシュトークン取得
    scope: scopes,//ユーザに要求する権限のリスト
    include_granted_scopes: true//ユーザが以前アプリに許可した権限を含める設定
  });
  //console.log(authorizationUrl)
  //特定のURLにリダイレクトするレスポンスを返す
  //ユーザをauthorizationUrlにリダイレクト
  return NextResponse.redirect(new URL(authorizationUrl, request.url));
}