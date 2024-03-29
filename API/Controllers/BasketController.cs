using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    public class BasketController : BaseApiController
    {
        private readonly StoreContext _context;

        public BasketController(StoreContext context)
        {
            _context = context;
        }

        [HttpGet(Name = "GetBasket")]
        public async Task<ActionResult<BasketDto>> GetBasket()
        {
            Basket basket = await RetrieveBasket(GetBuyerId());

            if (basket == null) return NotFound();

            return basket.MapBasketToDto();
        }



        [HttpPost] // we get productId & quantity from queryString 
        public async Task<ActionResult<BasketDto>> AddItemToBasket(int productId, int quantity)
        {
            //get basket || in case the buyer has not basket from before, create the basket 
            var basket = await RetrieveBasket(GetBuyerId());
            // the FirstOrDefault method returns null if the basket is not found 
            if(basket == null) basket = CreateBasket(); 
            //get product 
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return BadRequest(new ProblemDetails{Title= "Product Not Found"});
            //add item
            basket.AddItem(product, quantity); 
            //save changes 
            var result = await _context.SaveChangesAsync() > 0;
            
            if (result )  return CreatedAtRoute("GetBasket", basket.MapBasketToDto()); 

            return BadRequest(new ProblemDetails{Title= "Problem saving item to basket"});

        }

       

        [HttpDelete]
        public async Task<ActionResult> RemoveBaksetItem(int productId, int quantity)
        {
            //get basket 
            var basket = await RetrieveBasket(GetBuyerId());
            if (basket == null) return NotFound();

            // get the item inside the basket and remove it
            basket.RemoveItem(productId, quantity);

            var result = await _context.SaveChangesAsync() > 0;

            if (result) return Ok();

            return BadRequest(new ProblemDetails{Title = "Problem removing item from the basket"});
        }

        private async Task<Basket> RetrieveBasket(string buyerId)
        {
            if (string.IsNullOrEmpty(buyerId)){
                Response.Cookies.Delete("buyerId");
                return null; 
            }
            return await _context.Basket
                .Include(i => i.Items)
                .ThenInclude(p => p.Product)
                .FirstOrDefaultAsync(x => x.BuyerId == buyerId);
        }

        private string GetBuyerId()
        {
            // (??) is a null conditional operator and means if the first condition is null the second 
            // condition gets executed
            return User.Identity?.Name ?? Request.Cookies["buyerId"];
            
        }

        private Basket CreateBasket()
        {
            // add buyer id 
            var buyerId = User.Identity?.Name;
            if (string.IsNullOrEmpty(buyerId))
            {
                buyerId = Guid.NewGuid().ToString();
                var cookieOptions = new CookieOptions{IsEssential = true, Expires = DateTime.Now.AddDays(30)};
                Response.Cookies.Append("buyerId", buyerId, cookieOptions);
            }
           
            // create the basket 
            var basket = new Basket{BuyerId = buyerId}; 
            // add the new basket to the Baskets 
            _context.Basket.Add(basket);

            return basket;
        
        }
      
    }
}