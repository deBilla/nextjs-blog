---
title: "Spring boot series — Creating a Web Socket to send real time market data"
date: "2021-06-10"
preview: "Hi guys, So we have completed creating a cool stock market application which displays real stock market information for a set of Symbols…"
description: "Adding a WebSocket to a Spring Boot service so stock market data streams to clients in real time instead of being polled."
tags: ["spring-boot", "realtime"]
mediumUrl: "https://medium.com/@billacode/spring-boot-series-creating-a-web-socket-to-send-real-time-market-data-ee5273b3204b"
---
![Spring boot series — Creating a Web Socket to send real time market data — figure 1](./images/spring-boot-series-creating-a-web-socket-to-send-real-time-market-data/1.png)

Hi guys, So we have completed creating a cool stock market application which displays real stock market information for a set of Symbols. In this tutorial we are going to see how to send real time stock market data to front end using a web socket.

For crating the web socket, first we have to add some dependencies to our build.gradle file. So after adding the web socket dependency, now our build.gradle file’s dependencies should look like this.

```
dependencies {
   implementation 'org.springframework.boot:spring-boot-starter'
   implementation 'org.springframework.boot:spring-boot-starter-websocket'
   implementation 'com.yahoofinance-api:YahooFinanceAPI:3.15.0'
   implementation 'org.projectlombok:lombok'
   testImplementation 'org.apache.httpcomponents:httpclient'
   testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

Codes and details about the project so far can be found if you visit this tutorial.

Now we have to create a Web socket message configurer to configure our web socket end points. So there i will create the web socket as “/ws-message” and then for the application prefix i will use the value “/app”. Further i will also create a destination prefix called “/topic”. Now the code for the file WebSocketMessageConfig.java should look like this.

```
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketMessageConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-message").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic");
    }
}
```

Here we have used withStockJs() method so in future when we access this using our Flutter app it will be easy to handle. Now i will create another file to use as the controller for the socket connection and named it SocketController.java. Here i will create a scheduler to send our market data in intervals. So the code for that is as follows.

```
import com.billa.code.stockMarket.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import static java.util.concurrent.TimeUnit.SECONDS;

@Controller
public class SocketController {
    @Autowired
    SimpMessagingTemplate template;

    @Autowired
    StockService stockService;

    private static final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);

    @MessageMapping("/hello")
    public void greeting() {
        scheduler.scheduleAtFixedRate(() -> {
            template.convertAndSend("/topic/message", stockService.getStockResponse());
        }, 0, 2, SECONDS);
    }
}
```

Here i have added a new method called getStockResponse in our Stock service class so the code for the modified StockService.java is as follows.

```
import com.billa.code.stockMarket.model.StockModel;
import com.billa.code.stockMarket.model.StockResponseModel;
import com.billa.code.stockMarket.wrapper.StockWrapper;
import org.springframework.stereotype.Service;
import yahoofinance.Stock;
import yahoofinance.YahooFinance;
import java.util.ArrayList;
import java.util.List;

@Service
public class StockService {
    public StockWrapper findStock(String symbol) {
        try {
            return new StockWrapper(YahooFinance.get(symbol));
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return null;
    }

    public StockResponseModel getStockResponse() {
        List<StockModel> stocks = new ArrayList<>();
        String[] symbolArr = {"A", "AA", "AAC", "GOOG", "AMZN", "AAT", "AAN", "T", "TD", "TARO", "TM"};

        for (String s : symbolArr) {
            Stock stock = findStock(s).getStock();
            StockModel stockModel = new StockModel(s, stock.getName(), stock.getQuote().getAsk().toString(), stock.getQuote().getChangeInPercent().toString());
            stocks.add(stockModel);
        }

        StockResponseModel res = new StockResponseModel();
        res.setStock(stocks);
        res.setStockExg("US");

        return res;
    }
}
```

So the logic is like this. A front end application which is using StockJS can create a connection to our web socket on the **_ws://localhost:8080/ws-message._**_ _Now it will connect to our web socket and in the front end app on the connection creation method’s call back function we have to subscribe to the **/topic/message** destination of our web socket. Then when we send a message to **/app/hello** end point of our web socket from our front end app, backend application will send market data in every 2 seconds to the front end through the web socket.

Guys code base for this project is in the following link. Fork the project and please star it if you find it useful. Follow me on Github and you will be notified with my new cool projects.

So in the next tutorial we will get the data from the web socket and show it in our Flutter app. Happy Coding !!!
