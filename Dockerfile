FROM nginx:alpine

# Копируем все файлы фронтенда в nginx
COPY . /usr/share/nginx/html

# Копируем конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80