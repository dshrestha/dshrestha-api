var blogPosts = [{
    "id": 1,
    "title": "Customizing ember-resolver to support folder structure that makes most sense to you.",
    "createdOn": "2016-09-20T04:03:56.571Z",
    "categoryId": 1,
    "abstract": `
Ever since ember introduced POD structure people have been debating about its advantages and disadvantages.
I guess it boils down to the matter of taste and the size of the project itself. I definitely feel like  most of us would 
favor the older approach of having all controllers, routes etc in their respective "controllers", "routes" folder etc if the project size
 is small to medium. For very large projects, the POD structure definitely makes things bit more "well organized" but still 
 as the project size grows even POD structure might feel difficult to maintain. So I am writing this post to break the chain of
   POD vs no POD and have freedom to have folder structure that makes most sense to individual developer. 
 `,
    "content": `
    
<p>Developers who like to code clean also like to organize their project files in logical order. Organizing your source code files
in proper structure makes it much more easier to segregate resources that are associated with specific domain/module and adds
to the overall cleanliness and manageability. Ember is no stranger to this ideology, with the advent of ember cli, ember provides rally neat folder structure. 
If you were to create a new project now, you will be given app/controllers/, app/models/ etc more about what those folder are for can be 
found <a href="https://ember-cli.com/user-guide/#layout-within-app-directory" target="_blank">here</a>.
So all is good so far, you are working in a project and you know exactly where your controller, routes, adapters etc should go.
Slowly requirements are being added and you will end up adding files to each of those folders. Before you know it
there are more than 50 files in each of those folders and you are scrolling through them to find a file you want to work on.
This can be pretty frustrating experience, made even worse when you have to switch between controller, components, templates, and routes associated with 
a feature you are building.</p>
    
Then came  <a href="http://cball.me/organize-your-ember-app-with-pods/">POD</a> which took a jab at solving this issue: 

<ul>
    <li>the component.js and template.hbs files associated with component goes in their own separate folder -- YAYYYY</li>
    <li>the route.js, controller.js, template.hbs, service.js file associated with a route goes in their own separate folder -- BIG YAYYYY</li>
    <li>but if we create model whose name doesn't match with route name, you end up with a folder with model name with model.js file within it
     and same holds true when you create service so time to fall back to the classical approach -- BOOO</li>
</ul>   
    
    
<p>In most of large scale projects you will almost always find concept of modules forming around the top most parent routes. A simple example of such
segregation can be seen materializing in the given route structure:</p>
    
<pre>
Router.map(function () {
  //employees section is separate module
  this.route('employees', function(){
    this.route('employee-detail');
    this.route('service-details');
    this.route('documents');
  });
  
  //training is separate module
  this.route('training', function(){
    this.route('technical', function(){
        ....
    });
    this.route('non-technical', function(){
        ....
    });    
  });
});
</pre>    

<p>So naturally it would make sense to have all the resources associated with a module to be placed within it. An example for such a structure would look like:
</p>

<pre>

    app
     |-modules
         |-employees
             |-models
                  |-employee.js
                  |-tax.js
                  |-service-history.js
             |-adapters
             |-components
                  |-list-employee-payroll
                            |-component.js
                            |-template.js
             |-serializers
             |-routes
                 |-taxes
                     |-route.js
                     |-template.hbs
                 |-route.js
                 |-template.hbs
         |-training
             |-models
                  |-training.js
                  |-training-category.js
             |-adapters
             |-serializers
             |-routes
                 |-technical
                     |-route.js
                     |-template.hbs
                 |-non-technical
                     |-route.js
                     |-template.hbs
                 |-route.js
                 |-template.hbs   
                               
</pre>


<p>Now finally back to the <a href="https://github.com/ember-cli/ember-resolver" target="_blank">ember resolver</a> which will help us to achieve the 
 customized folder structure we showed above. Remember you don't have to follow the same folder pattern that I mentioned here, you can make your own convention.
 The solution I am providing is just a general guideline which you can follow to setup your own solution.
 
Ember resolver is as name suggests is responsible for resolving a resource, so simply put, if you ask the resolver to give us a "blog" model, 
it figures out possible locations where the source file could be and returns it if found or else it will throw an error saying it couldn't find it.</p>
If you go through ember resolvers' source code you will notice this particular function: </p>
  
<pre>
  //resolver.js file
  moduleNameLookupPatterns: Ember.computed(function(){
    return [
      this.podBasedModuleName,
      this.podBasedComponentsInSubdir,
      this.mainModuleName,
      this.defaultModuleName
    ];
  })
  
</pre>
  
<p>So if you were to test it out, each of those function in the return list is a method that returns path for a resource. "podBasedModuleName" method
will return path the resource based on POD structure convention, if the resource exists in that path it simply returns it or else it looks up the path returned by next function and so 
on and so forth. To override this behavior we will have to edit <b>app/resolver.js</b> file that basically exports the ember resolver. Given below is my custom version : </p>

<pre>

import Ember from 'ember';
import Resolver from 'ember/resolver';

const modules = ['employees', 'training'];//list of module names(route names)

var resolver = Resolver.extend({

    /**
     * Custom resolver 
     *
     * @method 'myCustomResolver'
     * @param {String} module name
     * @param {Object} parsed resource name
     * @return {String} path to resource
     * */
    myCustomResolver: function (module, parsedName) {
        var podPrefix = this.namespace.podModulePrefix || this.namespace.modulePrefix;
        var podPrefixWithModule = podPrefix + '/' + module;
        var path = null;
        var re = new RegExp('^' + module + '(/)?');
        var reComponentTemplate = new RegExp('^components/' + module);
        var fullNameWithoutType = parsedName.fullNameWithoutType;
        var moduleNameMatch = fullNameWithoutType.match(re);
        var podBasedLookupWithPrefix = function (podPrefix, parsedName) {
            if (parsedName.type === 'template') {
                fullNameWithoutType = fullNameWithoutType.replace(/^components\//, '');
            }
            return (podPrefix + '/' + fullNameWithoutType.replace(re, '') + '/' + parsedName.type).replace(/\/{2,}/g, '/');
        };
            
        //look up the file in our module folder    
        if (["controller", "route"].indexOf(parsedName.type) !== -1) {
            path = moduleNameMatch ? podBasedLookupWithPrefix(podPrefixWithModule + '/routes', parsedName) : null;
        } else if (["component"].indexOf(parsedName.type) !== -1) {
            path = moduleNameMatch ? podBasedLookupWithPrefix(podPrefixWithModule + '/components', parsedName) : null;
        } else if (["template"].indexOf(parsedName.type) !== -1) {
            /**
             * templates can be for components as well as for routes so use different paths based
             * on what context the template is being used.
             * */
            if (fullNameWithoutType.match(reComponentTemplate)) {
                path = podBasedLookupWithPrefix(podPrefixWithModule + '/components', parsedName);
            } else {
                path = moduleNameMatch ? podBasedLookupWithPrefix(podPrefixWithModule + '/routes', parsedName) : null;
            }
        } else {
            path = podPrefixWithModule + '/' + this.pluralize(parsedName.type) + '/' + fullNameWithoutType;
        }

        return path;
    },

    moduleNameLookupPatterns: Ember.computed(function () {
        var defaults = this._super();
        //defaults.pushObject(this.moduleBasedComponentPattern);
        modules.forEach((module)=> {
            let studioModule = module + 'BasedModuleName';

            if (this[studioModule]) {
                defaults.pushObject(this[studioModule]);
            }
        });

        return defaults;
    })
});

/**
 * Dynamically injects resolver functions based on modules
 * */
modules.forEach(function (module) {
    let obj = {};
    obj[\`$\{module\}BasedModuleName\`] = function (parsedName) {
        return this.myCustomResolver(module, parsedName);
    };
    resolver.reopen(obj);
});

export default resolver;
</pre>

<p>The only catch with this resolver is that your components are now namespaced ie. in your template you will invoke component by appending the module name eg: {{employees.list-employee-payroll}}</p>
`
}];

exports.find = function (closure) {
    return blogPosts.filter(closure);
}

exports.normalize = function (post) {
    return {
        "type": "blog-post",
        "id": post.id,
        "attributes": {
            "title": post.title,
            "createdOn": post.createdOn,
            "abstract": post.abstract
        }, "relationships": {
            "category": {
                "data": {"type": "blog-category", "id": post.categoryId}
            },
            "content": {
                "links": {
                    "related": "/api/blog/posts/" + post.id + "/content"
                }
            }
        }
    }
}