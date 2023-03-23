import { Grid, Paper } from "@mui/material";
import AppPagination from "../../app/components/AppPagination";
import CheckBoxButtons from "../../app/components/CheckBoxButtons";
import RadioButtonGroup from "../../app/components/RadioButton";
import useProducts from "../../app/hooks/useProducts";
import LoadingComponent from "../../app/layout/LoadingComponent";
import { useAppDispatch, useAppSelector } from "../../app/store/configureStore";
import {
  setPageNumber,
  setProductParams,
} from "./catalogSlice";
import ProductList from "./ProductList";
import ProductSearch from "./productSearch";

const sortOptions = [
  { value: "name", label: "Alphabetical" },
  { value: "priceDesc", label: "Price - High to low" },
  { value: "price", label: "Price - Low to high" },
];

export default function Catalog() {
  const { products, brands, types, filtersLoaded, metaData } = useProducts();
  const { productParams } = useAppSelector(state => state.catalog);
  const dispatch = useAppDispatch();

  if (!filtersLoaded) return <LoadingComponent message="Loading products..." />;

  return (

    <Grid container columnSpacing={4}>
      <Grid item xs={3}>
        <Paper sx={{ mb: 2 }}>
            <ProductSearch />
        </Paper>
        <Paper sx={{ mb: 2, padding: 2}}>
         <RadioButtonGroup
           selectedValue={productParams.orderBy}
           options={sortOptions}
           onChange={(e) => dispatch(setProductParams({orderBy: e.target.value}))}
         />
        </Paper>

        <Paper sx={{ mb: 2, padding: 2}}>
         <CheckBoxButtons
         items={brands}
         checked={productParams.brands}
         onChange={(items: string []) => dispatch(setProductParams({brands: items}))}
         />
        </Paper>
        

        <Paper sx={{ mb: 2, padding: 2}}>
        <CheckBoxButtons
         items={types}
         checked={productParams.brands}
         onChange={(items: string []) => dispatch(setProductParams({types: items}))}
         />
        </Paper>
      </Grid>

      <Grid item xs={9}>
        <ProductList products={products} />
      </Grid>
      
      <Grid item xs={3} /> 
      <Grid item xs={9} sx={{mb:2}}>
        {metaData && 
        <AppPagination 
        metaData={metaData}
        onPageChange={(page: number) => dispatch(setPageNumber({pageNumber: page}))}
      />}
      
      </Grid>   
    </Grid>
  );
}
