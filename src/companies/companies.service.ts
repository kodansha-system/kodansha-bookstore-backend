import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>,
    private fileService: FilesService,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    user: IUser,
    file?: Express.Multer.File,
  ) {
    let company = {};
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      company = await this.companyModel.create({
        ...createCompanyDto,
        logo: image.url,
        createdBy: user,
      });
    } else {
      company = await this.companyModel.create({
        ...createCompanyDto,
        logo: 'https://www.google.com/imgres?q=default%20image&imgurl=https%3A%2F%2Fcdn.vectorstock.com%2Fi%2Fpreview-1x%2F37%2F31%2Fdefault-paper-word-sign-with-colorful-spectrum-vector-48293731.jpg&imgrefurl=https%3A%2F%2Fwww.vectorstock.com%2Froyalty-free-vectors%2Fdefault-vectors&docid=FSLeHcyDKeIvXM&tbnid=Gg5ap9pNfRrm_M&vet=12ahUKEwjnu6aN1qSLAxWXOTQIHZmwHzQQM3oECF4QAA..i&w=508&h=250&hcb=2&ved=2ahUKEwjnu6aN1qSLAxWXOTQIHZmwHzQQM3oECF4QAA',
        createdBy: user,
      });
    }

    return {
      company,
    };
  }

  async findAll(query) {
    const { filter, sort, population } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.companyModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .exec();

    return {
      meta: {
        currentPage: filter?.current || 1,
        pageSize: defaultLimit,
        totalItems,
        totalPages,
      },
      companies: result,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} company`;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    user: IUser,
    file?: Express.Multer.File,
  ) {
    let updateCompany = {};
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((error) => {
        console.log(error);
        throw new BadRequestException('There are some errors');
      });

      updateCompany = await this.companyModel.updateOne(
        { _id: id },
        { ...updateCompanyDto, logo: image.url, updatedBy: user },
      );
    } else {
      updateCompany = await this.companyModel.updateOne(
        { _id: id },
        { ...updateCompanyDto, updatedBy: user },
      );
    }

    return updateCompany;
  }

  remove(id: string, user: IUser) {
    return this.companyModel.updateOne(
      { _id: id },
      {
        deletedBy: user,
        isDeleted: true,
      },
    );
  }
}
