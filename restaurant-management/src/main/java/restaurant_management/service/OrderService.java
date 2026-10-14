package restaurant_management.service;

import restaurant_management.entity.Order;
import restaurant_management.entity.OrderItem;
import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.OrderType;

import java.util.List;

public interface OrderService {

    Order createOrder(Order order, List<OrderItem> items);

    Order createReservationOrder(Order reservationOrder, List<OrderItem> items);

    List<Order> getAllOrders();

    Order getOrderById(Long id);

    Order updateOrderStatus(Long id, OrderStatus status);

    List<Order> getOrdersByStatus(OrderStatus status);

    List<Order> getOrdersByType(OrderType orderType);

    List<Order> getOrdersByCustomer(Long customerId);

    List<Order> getOrdersByTable(Long tableId);
}
