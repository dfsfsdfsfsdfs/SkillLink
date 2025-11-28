// services/googleDrivePersonal.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

class GoogleDrivePersonal {
  constructor() {
    this.oAuth2Client = null;
    this.drive = null;
    this.SCOPES = ['https://www.googleapis.com/auth/drive.file'];
    this.TOKEN_PATH = path.join(process.cwd(), 'token.json');
    this.CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Cargar credenciales desde credentials.json
      if (fs.existsSync(this.CREDENTIALS_PATH)) {
        const content = fs.readFileSync(this.CREDENTIALS_PATH);
        const credentials = JSON.parse(content);
        
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        this.oAuth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );

        // Cargar token si existe
        if (fs.existsSync(this.TOKEN_PATH)) {
          const token = fs.readFileSync(this.TOKEN_PATH);
          this.oAuth2Client.setCredentials(JSON.parse(token));
          this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
          console.log('✅ Google Drive conectado exitosamente');
        } else {
          console.log('⚠️  Token no encontrado. Ejecuta getAccessToken()');
        }
      } else {
        console.log('❌ Archivo credentials.json no encontrado');
      }
    } catch (error) {
      console.error('Error inicializando Google Drive:', error);
    }
  }

  async getAccessToken() {
    if (!this.oAuth2Client) {
      throw new Error('OAuth2 client no inicializado');
    }

    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });

    console.log('🔗 Authoriza esta aplicación visitando esta URL:');
    console.log(authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) => {
      rl.question('📝 Ingresa el código de autorización: ', (code) => {
        rl.close();
        this.oAuth2Client.getToken(code, async (err, token) => {
          if (err) {
            console.error('❌ Error obteniendo token:', err);
            reject(err);
            return;
          }
          
          this.oAuth2Client.setCredentials(token);
          
          // Guardar token para uso futuro
          fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(token));
          console.log('✅ Token guardado en', this.TOKEN_PATH);
          
          this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
          resolve(token);
        });
      });
    });
  }

  async uploadFile(filePath, fileName, folderId = null) {
    if (!this.drive) {
      await this.initializeAuth();
    }

    try {
      const fileMetadata = {
        name: fileName,
        mimeType: this.getMimeType(filePath),
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: this.getMimeType(filePath),
        body: fs.createReadStream(filePath),
      };

      console.log(`📤 Subiendo archivo: ${fileName}`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink, mimeType',
        supportsAllDrives: true,
      });

      console.log('✅ Archivo subido exitosamente:', response.data.name);

      // Hacer el archivo públicamente accesible
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });

      console.log('🔗 Enlace público generado');

      return {
        id: response.data.id,
        name: response.data.name,
        url: response.data.webViewLink,
        downloadUrl: response.data.webContentLink,
        mimeType: response.data.mimeType,
      };
    } catch (error) {
      console.error('❌ Error subiendo archivo a Google Drive:', error);
      
      // Si el token expiró, intentar renovar
      if (error.code === 401) {
        console.log('🔄 Token expirado, renovando...');
        await this.getAccessToken();
        return this.uploadFile(filePath, fileName, folderId);
      }
      
      throw error;
    }
  }

  async createFolder(folderName, parentFolderId = null) {
    if (!this.drive) {
      await this.initializeAuth();
    }

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, webViewLink',
        supportsAllDrives: true,
      });

      return {
        id: response.data.id,
        name: response.data.name,
        url: response.data.webViewLink,
      };
    } catch (error) {
      console.error('Error creando carpeta en Drive:', error);
      throw error;
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Verificar si estamos autenticados
  async isAuthenticated() {
    if (!this.drive) {
      await this.initializeAuth();
    }
    return this.drive !== null;
  }
}

export default new GoogleDrivePersonal();