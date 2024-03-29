import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import agent from "../../app/api/agent";
import { User } from "../../app/models/user";
import { router } from "../../app/router/Routes";
import { setBasket } from "../basket/basketSlice";

export interface AccountState {
     user: User | null;
}

const initialState: AccountState = {
    user: null
}

// User -> returned and FieldValues -> arguments
export const signInUser = createAsyncThunk<User,  FieldValues>(
    'account/signInUser',
    async (data, thunkAPI) => {
        try {
             const userDto = await agent.Account.login(data);
             const {basket, ...user} = userDto;
             if (basket) thunkAPI.dispatch(setBasket(basket));
             localStorage.setItem('user', JSON.stringify(user));
             return user; 
        } catch (error: any){
            return thunkAPI.rejectWithValue({error: error.data})
        }
    }
)

export const fetchCurrentUser = createAsyncThunk<User>(
    'account/fetchCurrentUser',
    async (_, thunkAPI) => {
        thunkAPI.dispatch(setUser(JSON.parse(localStorage.getItem('user')!)));
        try {
             const userDto = await agent.Account.currentUser();
             const {basket, ...user} = userDto;
             if (basket) thunkAPI.dispatch(setBasket(basket));
             localStorage.setItem('user', JSON.stringify(user));
             return user; 
        } catch (error: any){
            return thunkAPI.rejectWithValue({error: error.data})
        }
    },
    {
        condition: () => {
            if (!localStorage.getItem('user')) return false;  
            // iff we have a token we send a request to the API
        }
    }
)



export const accountSlice = createSlice({
    name: 'account',
    initialState,
    // methods which have nothing to do with the API, but with the store 
    reducers: {
        signOut: (state) => {
            state.user = null;
            localStorage.removeItem('user');
            router.navigate('/');
        },
        setUser: (state, action) => {
            let claims = JSON.parse(atob(action.payload.token.split('.')[1]));
            let roles =
              claims[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
                ];
            state.user = {...action.payload, roles: typeof(roles) === 'string' ? [roles] : roles}
        }
    },
    // createAsyncThunk methods require extra-reducers 
    extraReducers: (builder => {
        builder.addCase(fetchCurrentUser.rejected, (state) => {
            state.user = null;
            localStorage.removeItem('user');
            toast.error('Session expired - please login agian');
            router.navigate('/');
        })
        builder.addMatcher(isAnyOf(signInUser.fulfilled, fetchCurrentUser.fulfilled), (state, action) => {
            let claims = JSON.parse(atob(action.payload.token.split('.')[1]));
            let roles =
              claims[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
                ];
            state.user = {...action.payload, roles: typeof(roles) === 'string' ? [roles] : roles}
        });
        builder.addMatcher(isAnyOf(signInUser.rejected), (state, action) => {
           console.log(action.payload); 
        })
    })
})

export const {signOut, setUser} = accountSlice.actions;