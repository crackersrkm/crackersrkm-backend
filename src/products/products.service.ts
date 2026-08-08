import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const updated = this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(updated);
  }

  async findAll(query: GetProductsQueryDto): Promise<{ data: Product[]; total: number; limit: number; offset: number }> {
    const { limit = 10, offset = 0 } = query;
    const [data, total] = await this.productRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { id: 'ASC' },
    });
    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}
