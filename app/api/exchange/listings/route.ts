import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { skillExchangeService } from "@/services/skillExchangeService"
import { successResponse, errorResponse } from "@/lib/utils"
import { ListingType } from "@prisma/client"

// GET /api/exchange/listings — get my listings
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const listings = await skillExchangeService.getMyListings(currentUser.userId)
    return successResponse(listings)
  } catch {
    return errorResponse("Failed to fetch listings", 500)
  }
}

// POST /api/exchange/listings — create a listing
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const body = await req.json()
    const { skillName, type, description } = body

    if (!skillName || !type) {
      return errorResponse("skillName and type are required")
    }

    const listing = await skillExchangeService.createListing(
      currentUser.userId,
      { skillName, type: type as ListingType, description }
    )
    return successResponse(listing, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create listing"
    return errorResponse(message)
  }
}

// DELETE /api/exchange/listings — deactivate a listing
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { listingId } = await req.json()
    if (!listingId) return errorResponse("listingId is required")

    await skillExchangeService.deleteListing(listingId, currentUser.userId)
    return successResponse({ message: "Listing removed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove listing"
    return errorResponse(message)
  }
}
