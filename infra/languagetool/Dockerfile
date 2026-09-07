FROM erikvl87/languagetool:6.6@sha256:15f6078d70bef9b0a94c7e5838b26d4a955308491c47ffba7bd746b127a274a4

USER root
RUN apk add --no-cache nginx gettext
COPY nginx.conf.template start-service.sh /service/
COPY logback.xml /LanguageTool/logback.xml
RUN chmod +x /service/start-service.sh
USER languagetool
EXPOSE 8080
CMD ["bash", "/service/start-service.sh"]
