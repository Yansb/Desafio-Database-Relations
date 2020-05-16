import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const findCustomer = await this.customersRepository.findById(customer_id);

    const findProducts = await this.productsRepository.findAllById(products);

    const [{ quantity: newQuantity }] = products;
    const [{ quantity }] = findProducts;

    if (quantity < newQuantity) {
      throw new AppError(
        'You are requesting more quantity that we current have',
        400,
      );
    }

    if (!findProducts) {
      throw new AppError('This product does not exists!', 400);
    }

    if (!findCustomer) {
      throw new AppError('This customer does not exists!', 400);
    }
    const newProduct = await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer: findCustomer,
      products: newProduct,
    });

    return order;
  }
}

export default CreateOrderService;
