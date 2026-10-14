
package restaurant_management.dto;

import restaurant_management.entity.Order;
import restaurant_management.entity.OrderItem;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateOrderRequest {

    @NotNull(message = "Order is required")
    @Valid
    private Order order;

    @NotEmpty(message = "Order items cannot be empty")
    private List<OrderItem> items;

    public CreateOrderRequest() {
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
}