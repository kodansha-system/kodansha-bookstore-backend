import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Province, ProvinceDocument } from './schemas/province.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class ProvincesService {
  private apiShipping: AxiosInstance;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('SHIPPING_API_TOKEN');
    const shippingUrl = this.configService.get<string>('SHIPPING_BASE_URL');

    this.apiShipping = axios.create({
      baseURL: shippingUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });
  }

  async getProvinces() {
    try {
      const response = await this.apiShipping.get('/cities');
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Không thể lấy danh sách tỉnh thành');
    }
  }

  async getDistricts(id: string) {
    try {
      const response = await this.apiShipping.get(
        '/cities/' + id + '/districts',
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Không thể lấy danh sách tỉnh thành');
    }
  }

  async getWards(id: string) {
    try {
      const response = await this.apiShipping.get(
        '/districts/' + id + '/wards',
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Không thể lấy danh sách tỉnh thành');
    }
  }
}
