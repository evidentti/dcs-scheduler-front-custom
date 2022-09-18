FROM dcsscheduler.artifactorypro.shared.pub.tds.tieto.com/nginx:1.19.4

RUN mkdir -p /usr/share/nginx/html

COPY dist /usr/share/nginx/html

COPY conf /etc/nginx/conf.d/

EXPOSE 80
