FROM php:8.2-apache

# Enable Apache mod_rewrite (optional)
RUN a2enmod rewrite

# Copy code to Apache web root
COPY . /var/www/html
