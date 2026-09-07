FROM erikvl87/languagetool:6.6@sha256:15f6078d70bef9b0a94c7e5838b26d4a955308491c47ffba7bd746b127a274a4

USER root
# The pinned distribution contains Java 17 bytecode but bundles an older JRE.
RUN apk add --no-cache nginx gettext openjdk17-jre-headless
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH="/usr/lib/jvm/java-17-openjdk/bin:${PATH}"
COPY nginx.conf.template start-service.sh /service/
COPY logback.xml /LanguageTool/logback.xml
RUN chmod +x /service/start-service.sh
USER languagetool
RUN LANGUAGETOOL_API_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
    envsubst '${LANGUAGETOOL_API_KEY}' < /service/nginx.conf.template > /tmp/nginx-check.conf \
    && nginx -e /dev/stderr -t -c /tmp/nginx-check.conf \
    && rm /tmp/nginx-check.conf
EXPOSE 8080
CMD ["bash", "/service/start-service.sh"]
