# Utilisez l'image officielle de Node.js
FROM node:18

# Répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copiez les fichiers package.json et package-lock.json
COPY package.json ./

# Installation des dépendances
RUN npm install

# Installation de Redis
#RUN apt-get update && \
#    apt-get install -y redis-server && \
 #   apt-get clean && \
  #  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copiez le reste des fichiers de l'application
COPY . .

# Exposer le port 3001 utilisé par l'application
EXPOSE 3001

# Commande pour démarrer l'application
CMD ["npm", "start"]