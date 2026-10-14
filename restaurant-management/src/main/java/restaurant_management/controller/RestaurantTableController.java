package restaurant_management.controller;

import restaurant_management.entity.RestaurantTable;
import restaurant_management.enums.TableStatus;
import restaurant_management.service.RestaurantTableService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
public class RestaurantTableController {

    private final RestaurantTableService restaurantTableService;

    public RestaurantTableController(RestaurantTableService restaurantTableService) {
        this.restaurantTableService = restaurantTableService;
    }

    @PostMapping
    public ResponseEntity<RestaurantTable> createTable(
            @Valid @RequestBody RestaurantTable restaurantTable) {
        return new ResponseEntity<>(
                restaurantTableService.createTable(restaurantTable),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<RestaurantTable>> getAllTables() {
        return ResponseEntity.ok(restaurantTableService.getAllTables());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTable> getTableById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantTableService.getTableById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTable> updateTable(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantTable restaurantTable) {
        return ResponseEntity.ok(
                restaurantTableService.updateTable(id, restaurantTable)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        restaurantTableService.deleteTable(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<RestaurantTable>> getTablesByStatus(
            @PathVariable TableStatus status) {
        return ResponseEntity.ok(
                restaurantTableService.getTablesByStatus(status)
        );
    }
}

