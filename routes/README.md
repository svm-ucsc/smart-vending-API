**item**
----
  Returns data about items.

* **URL**

  /item

* **Method:**

  `GET`
  
*  **URL Params**

  **Optional:**

  `iids=[string,]`

  `fields=[string,]`

* **Sample Call:**

  ```javascript
    const query = '?iids=d016,t002&fields=cost,name'
    const url = BASE_URL + '/item' + query
    fetch(url, {mode:'no-cors'});
  ```