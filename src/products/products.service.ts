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

  async findAll(query: GetProductsQueryDto): Promise<{
    data: Product[];
    total: number;
    limit: number;
    offset: number;
    totalProductsCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const { limit = 10, offset = 0, search, stockFilter } = query;

    const qb = this.productRepository.createQueryBuilder('product');

    if (search && search.trim()) {
      qb.andWhere('LOWER(product.name) LIKE LOWER(:search)', { search: `%${search.trim()}%` });
    }

    if (stockFilter === 'instock') {
      qb.andWhere('product.stockQuantity >= 20 AND product.isActive = true');
    } else if (stockFilter === 'low') {
      qb.andWhere('product.stockQuantity > 0 AND product.stockQuantity < 20 AND product.isActive = true');
    } else if (stockFilter === 'out') {
      qb.andWhere('product.stockQuantity <= 0 AND product.isActive = true');
    } else if (stockFilter === 'inactive') {
      qb.andWhere('product.isActive = false');
    }

    qb.orderBy('product.id', 'ASC')
      .skip(offset)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    const totalProductsCount = await this.productRepository.count();
    const lowStockCount = await this.productRepository
      .createQueryBuilder('p')
      .where('p.stockQuantity > 0 AND p.stockQuantity < 20 AND p.isActive = true')
      .getCount();
    const outOfStockCount = await this.productRepository
      .createQueryBuilder('p')
      .where('p.stockQuantity <= 0 AND p.isActive = true')
      .getCount();

    return {
      data,
      total,
      limit,
      offset,
      totalProductsCount,
      lowStockCount,
      outOfStockCount,
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
