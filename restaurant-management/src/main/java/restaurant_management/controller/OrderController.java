
package restaurant_management.controller;

import restaurant_management.dto.CreateOrderRequest;
import restaurant_management.entity.Order;
import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.OrderType;
import restaurant_management.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        Order createdOrder = orderService.createOrder(
                request.getOrder(),
                request.getItems()
        );
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(
            @PathVariable OrderStatus status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(status));
    }

    @GetMapping("/type/{orderType}")
    public ResponseEntity<List<Order>> getOrdersByType(
            @PathVariable OrderType orderType) {
        return ResponseEntity.ok(orderService.getOrdersByType(orderType));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getOrdersByCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<Order>> getOrdersByTable(
            @PathVariable Long tableId) {
        return ResponseEntity.ok(orderService.getOrdersByTable(tableId));
    }
}