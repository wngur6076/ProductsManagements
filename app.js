axios.defaults.baseURL = "http://myapp.com:8000/api";

new Vue({
   el: '#app',
   data: {
      products: [],
      categories: [],

      order: {
         dir: 1,

         column: 'name'
      },

      filters: {
         name: '',

         keywords: ''
      },

      isSearching: false,

      perPage: 10,

      currentPage: 1,

      product: {
         id: null,
         name: '',
         category: '',
         price: ''
      },

      isEdit: false,

      errors: {},

      removedProductId: null,
   },

   mounted() {
      this.fetchProducts();
      this.fetchCategories();
   },

   computed: {
      // categories() {
      //    let categories = this.products.map(el => el.category);

      //    return Array.from(new Set(categories))
      //    .sort((a, b) => {
      //       if (a < b) return -1;
      //       else if (a > b) return 1;
      //       else return 0;
      //    });
      // },

      productsPaginated() {
         let start = (this.currentPage - 1) * this.perPage
         let end = this.currentPage * this.perPage
         return this.productsSorted.slice(start, end)
      },

      productsSorted () {
         return this.productsfiltered.sort((a, b) => {
            let left = a[this.order.column], right = b[this.order.column];

            if (isNaN(left) && isNaN(right)) {
               if (left < right) return -1 * this.order.dir;
               else if (left > right) return 1 * this.order.dir;
               else return 0; 
            } else {
               return (left - right) * this.order.dir
            }
         });
      },

      sortType () {
         return this.order.dir === 1 ? 'ascending' : 'descending'
      },

      keywordsIsInvalid () {
         return this.filters.keywords.length < 3;
      },

      productsfiltered () {
         let products = this.products;

         if (this.filters.name) {
            let findName = new RegExp(this.filters.name, 'i');
            products =  products.filter(el => el.name.match(findName))
         }

         return products;
      },

      isFirstPage () {
         return this.currentPage === 1;
      },

      isLastPage () {
         return this.currentPage >= this.pages;
      },

      pages () {
         return Math.ceil(this.productsfiltered.length / this.perPage)
      },

      modalTitle () {
         return this.isEdit ? "Update Product" : "Add New Product"
      },

      modalTextButton () {
         return this.isEdit ? "Update" : "Save"
      }
   },
   methods: {
      fetchProducts () {
         axios.get('/products')
            .then(({ data }) => {
               this.products = data.data
            })
      },

      fetchCategories () {
         axios.get('/categories')
            .then(({ data }) => {
               this.categories = data.data
            })
      },

      add () {
         this.isEdit = false

         this.product = {
            id: null,
            name: '',
            category: '',
            price: '' 
         }

         $(this.$refs.vuemodal).modal('show');
      },

      edit (product) {
         this.product = Object.assign({}, product);

         this.isEdit = true
         $(this.$refs.vuemodal).modal('show');
      },

      saveOrUpdate () {
         if (this.isEdit) {
            this.update();
         } else {
            this.save();
         }
      },

      update () {
         axios.put('/products/' + this.product.id, this.product)
            .then(({ data }) => {
               let index = this.products.findIndex(item => item.id === this.product.id);

               this.products.splice(index, 1, data.data);
               
               this.isEdit = false;

               this.errors = {}

               $(this.$refs.vuemodal).modal('hide');
            })
            .catch(( { response }) => {
               this.errors = response.data.errors
            })
      },

      save () {
         this.product.price = this.product.price * 100
         axios.post('/products', this.product)
            .then(({ data }) => {
               this.productsPaginated.unshift(data.data)

               this.product = {
                  id: null,
                  name: '',
                  category: '',
                  price: ''
               }

               this.errors = {}

               $(this.$refs.vuemodal).modal('hide');
            })
            .catch(( { response }) => {
               this.errors = response.data.errors
            })
      },

      remove (product) {
         if (confirm("Are you sure?")) {
            axios.delete('/products/' + product.id)
               .then(res => {
                  this.removedProductId = product.id
                  
                  new Promise(resolve => setTimeout(resolve, 1000))
                     .then(() => {
                        this.removedProductId = null
                        let index = this.products.findIndex(item => item.id === product.id);
                        this.products.splice(index, 1)
                     })
            })
         }
      },

      switchPage (page) {
         this.currentPage = page
      },

      prev () {
         if (!this.isFirstPage) {
            this.currentPage--;
         }
      },

      next () {
         if (!this.isLastPage) {
            this.currentPage++;
         }
      },

      classes (column) {
         return [
            'sort-control',
            column === this.order.column ? this.sortType : ''
         ]
      },

      sort (column) {
         this.order.column = column;
         this.order.dir *= -1
      },

      clearText () {
         this.filters.name = this.filters.keywords = "";

         this.isSearching = false
      },

      search() {
         if (!this.keywordsIsInvalid) {
            this.filters.name = this.filters.keywords;

            this.isSearching = true
         }
      
      }
   },
})