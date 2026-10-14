package restaurant_management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Only recipe images are public. Payment proof files must be served by
        // an authenticated controller after checking the payment owner/role.
        registry.addResourceHandler("/uploads/recipes/**")
                .addResourceLocations("file:uploads/recipes/");
    }
}
