package com.frances.data.visualization.narrativevisualization.domain.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 *
 * @author franceslopez
 */
@Controller
@RequestMapping(value = {"", "/"})
public class Home {
    
    @RequestMapping(method = RequestMethod.GET)
    public String Index() {
        return "index";
    }
    
}
