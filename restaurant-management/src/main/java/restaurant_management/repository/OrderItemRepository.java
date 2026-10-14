package restaurant_management.repository;

import restaurant_management.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;



public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    void deleteByOrderId(Long orderId);

    @Query("""
        SELECT oi.recipe.id, oi.recipe.name, SUM(oi.quantity)
        FROM OrderItem oi
        WHERE oi.order.status =
              restaurant_management.enums.OrderStatus.COMPLETED
        GROUP BY oi.recipe.id, oi.recipe.name
        ORDER BY SUM(oi.quantity) DESC
        """)
    List<Object[]> findBestSellingRecipes();

}

