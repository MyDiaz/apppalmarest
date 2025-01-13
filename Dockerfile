# Usa una imagen base de Node.js
FROM node:16.20.0-alpine

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos del proyecto
COPY package*.json ./

# Instala las dependencias
RUN npm install --omit=dev

# Copia el resto de los archivos de tu proyecto
COPY . .

# Expón el puerto que usa tu app (por ejemplo, 3000)
EXPOSE 3000

# Inicia la aplicación
CMD ["node", "index.js"]