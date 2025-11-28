// services/fileStorageService.js
import localStorage from './localStorageService.js';
// Importa el servicio que elijas

class FileStorageService {
  constructor(serviceType = 'local') {
    this.serviceType = serviceType;
    this.service = this.initializeService();
  }

  initializeService() {
    switch (this.serviceType) {
      case 'google':
        return import('./GoogleDrivePersonal.js');
      case 'firebase':
        return import('./firebaseStorage.js');
      case 'aws':
        return import('./awsS3Service.js');
      case 'github':
        return import('./githubStorage.js');
      case 'local':
      default:
        return localStorage;
    }
  }

  async uploadFile(fileBuffer, fileName, folder = 'actividades') {
    return await this.service.uploadFile(fileBuffer, fileName, folder);
  }
}

export default new FileStorageService(process.env.STORAGE_SERVICE || 'local');